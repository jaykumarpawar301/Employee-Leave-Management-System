using System.Security.Claims;

namespace EmployeeManagementAPI.Extensions;

public static class ClaimsExtensions
{
    // Reads the logged-in user's EmployeeId from the JWT
    public static int? GetEmployeeId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("employeeId");
        return int.TryParse(value, out var id) ? id : null;
    }
}