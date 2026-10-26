using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.DTOs;

public class EmployeeCreateDto
{
    [Required, StringLength(20)]
    public string EmployeeCode { get; set; } = null!;

    [Required, StringLength(150)]
    public string FullName { get; set; } = null!;

    [Required, EmailAddress, StringLength(200)]
    public string Email { get; set; } = null!;

    [Range(1, int.MaxValue, ErrorMessage = "DepartmentId is required.")]
    public int DepartmentId { get; set; }

    [StringLength(100)]
    public string? Designation { get; set; }

    [Required]
    public DateOnly JoiningDate { get; set; }
}

// EmployeeCode and JoiningDate are not editable after creation
public class EmployeeUpdateDto
{
    [Required, StringLength(150)]
    public string FullName { get; set; } = null!;

    [Required, EmailAddress, StringLength(200)]
    public string Email { get; set; } = null!;

    [Range(1, int.MaxValue, ErrorMessage = "DepartmentId is required.")]
    public int DepartmentId { get; set; }

    [StringLength(100)]
    public string? Designation { get; set; }
}

public class EmployeeResponseDto
{
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = null!;
    public string? Designation { get; set; }
    public DateOnly JoiningDate { get; set; }
    public bool IsActive { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}