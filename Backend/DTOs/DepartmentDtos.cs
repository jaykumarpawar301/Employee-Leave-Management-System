using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.DTOs;

public class DepartmentSaveDto
{
    [Required, StringLength(100)]
    public string DepartmentName { get; set; } = null!;

    [StringLength(500)]
    public string? Description { get; set; }
}

public class DepartmentResponseDto
{
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int ActiveEmployeeCount { get; set; }
}