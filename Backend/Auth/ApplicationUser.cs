using Microsoft.AspNetCore.Identity;

namespace EmployeeManagementAPI.Auth;

// Login account. EmployeeId links it to a row in the Employees table.
public class ApplicationUser : IdentityUser
{
    public int? EmployeeId { get; set; }
}