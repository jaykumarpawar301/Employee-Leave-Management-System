using System;
using System.Collections.Generic;

namespace EmployeeManagementAPI.Models;

public partial class LeaveRequest
{
    public int LeaveId { get; set; }

    public int EmployeeId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public string Reason { get; set; } = null!;

    public string Status { get; set; } = null!;

    public int? ApprovedByEmployeeId { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public virtual Employee? ApprovedByEmployee { get; set; }

    public virtual Employee Employee { get; set; } = null!;
}
