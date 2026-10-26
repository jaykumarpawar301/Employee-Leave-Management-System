using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.DTOs;
using EmployeeManagementAPI.Extensions;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
namespace EmployeeManagementAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _db;

    public EmployeesController(AppDbContext db)
    {
        _db = db;
    }

    // One reusable mapping: Employee -> EmployeeResponseDto
    private static readonly Expression<Func<Employee, EmployeeResponseDto>> ToDto = e =>
        new EmployeeResponseDto
        {
            EmployeeId = e.EmployeeId,
            EmployeeCode = e.EmployeeCode,
            FullName = e.FullName,
            Email = e.Email,
            DepartmentId = e.DepartmentId,
            DepartmentName = e.Department.DepartmentName,
            Designation = e.Designation,
            JoiningDate = e.JoiningDate,
            IsActive = e.IsActive
        };

    // GET /api/employees?search=asha&departmentId=1&isActive=true&page=1&pageSize=10
    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<PagedResult<EmployeeResponseDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] int? departmentId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Employees.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(e => e.FullName.Contains(s)
                                  || e.Email.Contains(s)
                                  || e.EmployeeCode.Contains(s));
        }
        if (departmentId.HasValue) query = query.Where(e => e.DepartmentId == departmentId);
        if (isActive.HasValue) query = query.Where(e => e.IsActive == isActive);

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(e => e.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToDto)
            .ToListAsync();

        return new PagedResult<EmployeeResponseDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    // GET /api/employees/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmployeeResponseDto>> GetById(int id)
    {
        var privileged = User.IsInRole("Admin") || User.IsInRole("Manager");
        if (!privileged && User.GetEmployeeId() != id) return Forbid();

        var emp = await _db.Employees.AsNoTracking()
            .Where(e => e.EmployeeId == id)
            .Select(ToDto)
            .FirstOrDefaultAsync();

        return emp is null ? NotFound(new { message = "Employee not found." }) : emp;
    }

    // POST /api/employees
    [HttpPost]
    public async Task<ActionResult<EmployeeResponseDto>> Create(EmployeeCreateDto dto)
    {
        var dept = await _db.Departments.FindAsync(dto.DepartmentId);
        if (dept is null || !dept.IsActive)
            return BadRequest(new { message = "Invalid or inactive department." });

        if (await _db.Employees.AnyAsync(e => e.EmployeeCode == dto.EmployeeCode))
            return Conflict(new { message = "Employee code already exists." });
        if (await _db.Employees.AnyAsync(e => e.Email == dto.Email))
            return Conflict(new { message = "Email already exists." });

        var emp = new Employee
        {
            EmployeeCode = dto.EmployeeCode.Trim(),
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim(),
            DepartmentId = dto.DepartmentId,
            Designation = dto.Designation,
            JoiningDate = dto.JoiningDate,
            IsActive = true
        };
        _db.Employees.Add(emp);
        await _db.SaveChangesAsync();

        var created = await _db.Employees.AsNoTracking()
            .Where(e => e.EmployeeId == emp.EmployeeId)
            .Select(ToDto)
            .FirstAsync();

        return CreatedAtAction(nameof(GetById), new { id = emp.EmployeeId }, created);
    }

    // PUT /api/employees/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, EmployeeUpdateDto dto)
    {
        var emp = await _db.Employees.FindAsync(id);
        if (emp is null) return NotFound(new { message = "Employee not found." });

        if (!await _db.Departments.AnyAsync(d => d.DepartmentId == dto.DepartmentId && d.IsActive))
            return BadRequest(new { message = "Invalid or inactive department." });

        if (await _db.Employees.AnyAsync(e => e.Email == dto.Email && e.EmployeeId != id))
            return Conflict(new { message = "Email is already used by another employee." });

        emp.FullName = dto.FullName.Trim();
        emp.Email = dto.Email.Trim();
        emp.DepartmentId = dto.DepartmentId;
        emp.Designation = dto.Designation;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // PATCH /api/employees/1/deactivate   (soft delete: history is kept)
    [HttpPatch("{id:int}/deactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var emp = await _db.Employees.FindAsync(id);
        if (emp is null) return NotFound(new { message = "Employee not found." });

        emp.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}