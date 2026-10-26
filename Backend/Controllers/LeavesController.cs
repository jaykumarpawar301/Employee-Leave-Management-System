using System.Linq.Expressions;
using EmployeeManagementAPI.Constants;
using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.DTOs;
using EmployeeManagementAPI.Extensions;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeavesController : ControllerBase
{
    private readonly AppDbContext _db;

    public LeavesController(AppDbContext db)
    {
        _db = db;
    }

    // One reusable mapping: LeaveRequest -> LeaveResponseDto
    private static readonly Expression<Func<LeaveRequest, LeaveResponseDto>> ToDto = l =>
        new LeaveResponseDto
        {
            LeaveId = l.LeaveId,
            EmployeeId = l.EmployeeId,
            EmployeeName = l.Employee.FullName,
            StartDate = l.StartDate,
            EndDate = l.EndDate,
            Reason = l.Reason,
            Status = l.Status,
            ApprovedByEmployeeId = l.ApprovedByEmployeeId,
            ReviewedByName = l.ApprovedByEmployee != null ? l.ApprovedByEmployee.FullName : null,
            ReviewedAt = l.ReviewedAt
        };

    /// <summary>Apply for leave as the logged-in employee.</summary>
    /// <remarks>Rejects past start dates, end dates before start dates, and overlaps with pending or approved leave.</remarks>
    /// <response code="200">Leave request submitted (status Pending).</response>
    /// <response code="400">Invalid dates.</response>
    /// <response code="409">Overlaps an existing leave request.</response>
    // POST /api/leaves
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Apply(ApplyLeaveDto dto)
    {
        var empId = User.GetEmployeeId();
        if (empId is null)
            return BadRequest(new { message = "Your login is not linked to an employee." });

        if (dto.EndDate < dto.StartDate)
            return BadRequest(new { message = "End date cannot be before start date." });

        if (dto.StartDate < DateOnly.FromDateTime(DateTime.Today))
            return BadRequest(new { message = "Start date cannot be in the past." });

        // Overlap rule: two ranges overlap when A.start <= B.end AND A.end >= B.start
        var overlaps = await _db.LeaveRequests.AnyAsync(l =>
            l.EmployeeId == empId
            && l.Status != LeaveStatuses.Rejected
            && l.StartDate <= dto.EndDate
            && l.EndDate >= dto.StartDate);

        if (overlaps)
            return Conflict(new { message = "You already have a pending or approved leave for these dates." });

        var leave = new LeaveRequest
        {
            EmployeeId = empId.Value,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Reason = dto.Reason.Trim(),
            Status = LeaveStatuses.Pending
        };
        _db.LeaveRequests.Add(leave);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Leave request submitted.", leaveId = leave.LeaveId, status = leave.Status });
    }

    /// <summary>List the logged-in user's own leave requests.</summary>
    // GET /api/leaves/my
    [HttpGet("my")]
    public async Task<ActionResult<List<LeaveResponseDto>>> My()
    {
        var empId = User.GetEmployeeId();
        if (empId is null)
            return BadRequest(new { message = "Your login is not linked to an employee." });

        return await _db.LeaveRequests.AsNoTracking()
            .Where(l => l.EmployeeId == empId)
            .OrderByDescending(l => l.StartDate)
            .Select(ToDto)
            .ToListAsync();
    }

    /// <summary>List all leave requests (Admin and Manager only), with filters and paging.</summary>
    // GET /api/leaves?status=Pending&employeeId=3&page=1&pageSize=10
    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<PagedResult<LeaveResponseDto>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] int? employeeId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (status is not null && !LeaveStatuses.All.Contains(status))
            return BadRequest(new { message = $"Status must be one of: {string.Join(", ", LeaveStatuses.All)}" });

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.LeaveRequests.AsNoTracking().AsQueryable();
        if (status is not null) query = query.Where(l => l.Status == status);
        if (employeeId.HasValue) query = query.Where(l => l.EmployeeId == employeeId);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.StartDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToDto)
            .ToListAsync();

        return new PagedResult<LeaveResponseDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <summary>Approve a pending leave request (Admin and Manager only).</summary>
    // PATCH /api/leaves/1/approve
    [HttpPatch("{id:int}/approve")]
    [Authorize(Roles = "Admin,Manager")]
    public Task<IActionResult> Approve(int id) => Review(id, LeaveStatuses.Approved);

    /// <summary>Reject a pending leave request (Admin and Manager only).</summary>
    // PATCH /api/leaves/1/reject
    [HttpPatch("{id:int}/reject")]
    [Authorize(Roles = "Admin,Manager")]
    public Task<IActionResult> Reject(int id) => Review(id, LeaveStatuses.Rejected);

    /// <summary>Withdraw your own pending leave request.</summary>
    // DELETE /api/leaves/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id)
    {
        var empId = User.GetEmployeeId();
        var leave = await _db.LeaveRequests.FindAsync(id);

        if (leave is null || leave.EmployeeId != empId)
            return NotFound(new { message = "Leave request not found." });

        if (leave.Status != LeaveStatuses.Pending)
            return BadRequest(new { message = $"Only pending requests can be cancelled. This one is {leave.Status}." });

        _db.LeaveRequests.Remove(leave);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Shared by approve and reject
    private async Task<IActionResult> Review(int id, string newStatus)
    {
        var reviewerId = User.GetEmployeeId();
        if (reviewerId is null)
            return BadRequest(new { message = "Your login is not linked to an employee." });

        var leave = await _db.LeaveRequests.FindAsync(id);
        if (leave is null)
            return NotFound(new { message = "Leave request not found." });

        if (leave.EmployeeId == reviewerId)
            return BadRequest(new { message = "You cannot review your own leave request." });

        if (leave.Status != LeaveStatuses.Pending)
            return BadRequest(new { message = $"This request is already {leave.Status}." });

        leave.Status = newStatus;
        leave.ApprovedByEmployeeId = reviewerId;
        leave.ReviewedAt = DateTime.Now;
        await _db.SaveChangesAsync();

        return Ok(new { message = $"Leave {newStatus.ToLower()}.", leaveId = leave.LeaveId, status = leave.Status });
    }
}