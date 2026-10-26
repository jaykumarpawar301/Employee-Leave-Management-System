using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementAPI.DTOs;

public class ApplyLeaveDto
{
    [Required]
    public DateOnly StartDate { get; set; }

    [Required]
    public DateOnly EndDate { get; set; }

    [Required, StringLength(500)]
    public string Reason { get; set; } = null!;
}

public class LeaveResponseDto
{
    public int LeaveId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = null!;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Reason { get; set; } = null!;
    public string Status { get; set; } = null!;
    public int? ApprovedByEmployeeId { get; set; }
    public string? ReviewedByName { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // Calculated, not stored. Counts both start and end day.
    public int TotalDays => EndDate.DayNumber - StartDate.DayNumber + 1;
}