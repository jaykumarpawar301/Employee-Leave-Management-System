using System.Linq.Expressions;
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
public class AttendanceController : ControllerBase
{
    private readonly AppDbContext _db;

    // Check-in after 10:00 AM counts as "Late"
    private static readonly TimeOnly LateAfter = new(10, 0);

    public AttendanceController(AppDbContext db)
    {
        _db = db;
    }

    private static readonly Expression<Func<Attendance, AttendanceResponseDto>> ToDto = a =>
        new AttendanceResponseDto
        {
            AttendanceId = a.AttendanceId,
            EmployeeId = a.EmployeeId,
            EmployeeName = a.Employee.FullName,
            WorkDate = a.WorkDate,
            CheckIn = a.CheckIn,
            CheckOut = a.CheckOut,
            Status = a.Status
        };

    
    [HttpPost("check-in")]
    public async Task<IActionResult> CheckIn()
    {
        var empId = User.GetEmployeeId();
        if (empId is null)
            return BadRequest(new { message = "Your login is not linked to an employee." });

        var now = DateTime.Now;                      // server local time
        var today = DateOnly.FromDateTime(now);

        if (await _db.Attendances.AnyAsync(a => a.EmployeeId == empId && a.WorkDate == today))
            return Conflict(new { message = "You have already checked in today." });

        var record = new Attendance
        {
            EmployeeId = empId.Value,
            WorkDate = today,
            CheckIn = now,
            Status = TimeOnly.FromDateTime(now) > LateAfter ? "Late" : "Present"
        };
        _db.Attendances.Add(record);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Checked in.", checkIn = record.CheckIn, status = record.Status });
    }

    // POST /api/attendance/check-out
    [HttpPost("check-out")]
    public async Task<IActionResult> CheckOut()
    {
        var empId = User.GetEmployeeId();
        if (empId is null)
            return BadRequest(new { message = "Your login is not linked to an employee." });

        var now = DateTime.Now;
        var today = DateOnly.FromDateTime(now);

        var record = await _db.Attendances
            .FirstOrDefaultAsync(a => a.EmployeeId == empId && a.WorkDate == today);

        if (record is null)
            return BadRequest(new { message = "You have not checked in today." });
        if (record.CheckOut is not null)
            return Conflict(new { message = "You have already checked out today." });

        record.CheckOut = now;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Checked out.",
            checkOut = record.CheckOut,
            hoursWorked = Math.Round((now - record.CheckIn).TotalHours, 2)
        });
    }

    // GET /api/attendance/today   -> my record for today (or null)
    [HttpGet("today")]
    public async Task<ActionResult<AttendanceResponseDto>> Today()
    {
        var empId = User.GetEmployeeId();
        if (empId is null)
            return BadRequest(new { message = "Your login is not linked to an employee." });

        var today = DateOnly.FromDateTime(DateTime.Now);
        var record = await _db.Attendances.AsNoTracking()
            .Where(a => a.EmployeeId == empId && a.WorkDate == today)
            .Select(ToDto)
            .FirstOrDefaultAsync();

        return record is null ? NotFound(new { message = "No attendance recorded yet today." }) : record;
    }

    // GET /api/attendance/my?from=2026-10-01&to=2026-10-31
    [HttpGet("my")]
    public async Task<ActionResult<List<AttendanceResponseDto>>> My(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var empId = User.GetEmployeeId();
        if (empId is null)
            return BadRequest(new { message = "Your login is not linked to an employee." });

        var query = _db.Attendances.AsNoTracking().Where(a => a.EmployeeId == empId);
        if (from.HasValue) query = query.Where(a => a.WorkDate >= from);
        if (to.HasValue) query = query.Where(a => a.WorkDate <= to);

        return await query.OrderByDescending(a => a.WorkDate).Select(ToDto).ToListAsync();
    }

    // GET /api/attendance?employeeId=3&from=...&to=...&page=1&pageSize=20
    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<PagedResult<AttendanceResponseDto>>> GetAll(
        [FromQuery] int? employeeId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Attendances.AsNoTracking().AsQueryable();
        if (employeeId.HasValue) query = query.Where(a => a.EmployeeId == employeeId);
        if (from.HasValue) query = query.Where(a => a.WorkDate >= from);
        if (to.HasValue) query = query.Where(a => a.WorkDate <= to);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.WorkDate)
            .ThenBy(a => a.Employee.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToDto)
            .ToListAsync();

        return new PagedResult<AttendanceResponseDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }
}