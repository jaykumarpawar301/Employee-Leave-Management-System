using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.DTOs;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public DepartmentsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/departments
    [HttpGet]
    public async Task<ActionResult<List<DepartmentResponseDto>>> GetAll()
    {
        return await _db.Departments
            .AsNoTracking()
            .OrderBy(d => d.DepartmentName)
            .Select(d => new DepartmentResponseDto
            {
                DepartmentId = d.DepartmentId,
                DepartmentName = d.DepartmentName,
                Description = d.Description,
                IsActive = d.IsActive,
                ActiveEmployeeCount = d.Employees.Count(e => e.IsActive)
            })
            .ToListAsync();
    }

    // GET /api/departments/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<DepartmentResponseDto>> GetById(int id)
    {
        var dept = await _db.Departments
            .AsNoTracking()
            .Where(d => d.DepartmentId == id)
            .Select(d => new DepartmentResponseDto
            {
                DepartmentId = d.DepartmentId,
                DepartmentName = d.DepartmentName,
                Description = d.Description,
                IsActive = d.IsActive,
                ActiveEmployeeCount = d.Employees.Count(e => e.IsActive)
            })
            .FirstOrDefaultAsync();

        return dept is null ? NotFound(new { message = "Department not found." }) : dept;
    }

    // POST /api/departments
    [HttpPost]
    public async Task<ActionResult<DepartmentResponseDto>> Create(DepartmentSaveDto dto)
    {
        if (await _db.Departments.AnyAsync(d => d.DepartmentName == dto.DepartmentName))
            return Conflict(new { message = "A department with this name already exists." });

        var dept = new Department
        {
            DepartmentName = dto.DepartmentName.Trim(),
            Description = dto.Description,
            IsActive = true
        };
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = dept.DepartmentId },
            new DepartmentResponseDto
            {
                DepartmentId = dept.DepartmentId,
                DepartmentName = dept.DepartmentName,
                Description = dept.Description,
                IsActive = dept.IsActive,
                ActiveEmployeeCount = 0
            });
    }

    // PUT /api/departments/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, DepartmentSaveDto dto)
    {
        var dept = await _db.Departments.FindAsync(id);
        if (dept is null) return NotFound(new { message = "Department not found." });

        if (await _db.Departments.AnyAsync(d => d.DepartmentName == dto.DepartmentName && d.DepartmentId != id))
            return Conflict(new { message = "Another department already uses this name." });

        dept.DepartmentName = dto.DepartmentName.Trim();
        dept.Description = dto.Description;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // PUT /api/departments/2/assign/5  -> move employee 5 into department 2
    [HttpPut("{id:int}/assign/{employeeId:int}")]
    public async Task<IActionResult> AssignEmployee(int id, int employeeId)
    {
        var dept = await _db.Departments.FindAsync(id);
        if (dept is null || !dept.IsActive)
            return NotFound(new { message = "Department not found or inactive." });

        var emp = await _db.Employees.FindAsync(employeeId);
        if (emp is null) return NotFound(new { message = "Employee not found." });

        emp.DepartmentId = id;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // PATCH /api/departments/1/deactivate
    [HttpPatch("{id:int}/deactivate")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var dept = await _db.Departments.FindAsync(id);
        if (dept is null) return NotFound(new { message = "Department not found." });

        if (await _db.Employees.AnyAsync(e => e.DepartmentId == id && e.IsActive))
            return BadRequest(new { message = "Move or deactivate the active employees first." });

        dept.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}