using EmployeeManagementAPI.Auth;
using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.DTOs;
using EmployeeManagementAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;


namespace EmployeeManagementAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly AppDbContext _db;
    private readonly TokenService _tokens;

    public AuthController(UserManager<ApplicationUser> users, AppDbContext db, TokenService tokens)
    {
        _users = users;
        _db = db;
        _tokens = tokens;
    }

    // POST /api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login(LoginDto dto)
    {
        var user = await _users.FindByEmailAsync(dto.Email);
        if (user is null || !await _users.CheckPasswordAsync(user, dto.Password))
            return Unauthorized(new { message = "Invalid email or password." });

        // A deactivated employee cannot log in
        if (user.EmployeeId.HasValue)
        {
            var active = await _db.Employees.AnyAsync(e => e.EmployeeId == user.EmployeeId && e.IsActive);
            if (!active) return Unauthorized(new { message = "This employee account is deactivated." });
        }

        var roles = await _users.GetRolesAsync(user);
        var (token, expires) = _tokens.CreateToken(user, roles);

        return new LoginResponseDto
        {
            Token = token,
            ExpiresAtUtc = expires,
            Email = user.Email!,
            EmployeeId = user.EmployeeId,
            Roles = roles
        };
    }

    // POST /api/auth/register  (Admin creates a login for an existing employee)
    [HttpPost("register")]
    
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (!AuthSeeder.Roles.Contains(dto.Role))
            return BadRequest(new { message = $"Role must be one of: {string.Join(", ", AuthSeeder.Roles)}" });

        var employee = await _db.Employees.FindAsync(dto.EmployeeId);
        if (employee is null || !employee.IsActive)
            return BadRequest(new { message = "Employee not found or inactive." });

        if (await _users.Users.AnyAsync(u => u.EmployeeId == dto.EmployeeId))
            return Conflict(new { message = "This employee already has a login." });

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            EmailConfirmed = true,
            EmployeeId = dto.EmployeeId
        };

        var result = await _users.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        await _users.AddToRoleAsync(user, dto.Role);
        return Ok(new { message = "Login created.", email = dto.Email, role = dto.Role });
    }

    // POST /api/auth/change-password  (any logged-in user, for their own account)
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var userId = User.FindFirstValue("sub");   // claim name as written in our token
        var user = userId is null ? null : await _users.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        var result = await _users.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return Ok(new { message = "Password changed." });
    }
}