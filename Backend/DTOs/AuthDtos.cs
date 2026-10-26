using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.DTOs;

public class LoginDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}

public class RegisterDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = null!;

    [Required, MinLength(8)]
    public string Password { get; set; } = null!;

    [Required]
    public string Role { get; set; } = null!;   // Admin, Manager or Employee

    [Range(1, int.MaxValue, ErrorMessage = "EmployeeId is required.")]
    public int EmployeeId { get; set; }
}

public class LoginResponseDto
{
    public string Token { get; set; } = null!;
    public DateTime ExpiresAtUtc { get; set; }
    public string Email { get; set; } = null!;
    public int? EmployeeId { get; set; }
    public IList<string> Roles { get; set; } = new List<string>();
}

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = null!;

    [Required, MinLength(8)]
    public string NewPassword { get; set; } = null!;
}