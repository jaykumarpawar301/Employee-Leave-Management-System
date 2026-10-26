namespace EmployeeManagementAPI.DTOs;

public class AttendanceResponseDto
{
    public int AttendanceId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = null!;
    public DateOnly WorkDate { get; set; }
    public DateTime CheckIn { get; set; }
    public DateTime? CheckOut { get; set; }
    public string Status { get; set; } = null!;

    // Calculated in C#, not stored in the database
    public double? HoursWorked =>
        CheckOut.HasValue ? Math.Round((CheckOut.Value - CheckIn).TotalHours, 2) : null;
}