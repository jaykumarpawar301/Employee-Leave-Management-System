using EmployeeManagementAPI.Data;
using EmployeeManagementAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementAPI.Auth;

public static class AuthSeeder
{
    public static readonly string[] Roles = { "Admin", "Manager", "Employee" };

    public static async Task SeedAsync(IServiceProvider sp)
    {
        var roleManager = sp.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();
        var db = sp.GetRequiredService<AppDbContext>();

        foreach (var role in Roles)
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));

        const string adminEmail = "admin@abc.com";

        // Find by plain Email column, so it works even if normalized fields are broken
        var existing = await userManager.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
        if (existing is not null)
        {
            // DEV ONLY: repair the user and reset the password. Remove this after logging in.
            await userManager.UpdateNormalizedEmailAsync(existing);
            await userManager.UpdateNormalizedUserNameAsync(existing);
            await userManager.UpdateAsync(existing);

            if (await userManager.HasPasswordAsync(existing))
                await userManager.RemovePasswordAsync(existing);

            var pw = await userManager.AddPasswordAsync(existing, "Admin@12345");
            if (!pw.Succeeded)
                throw new InvalidOperationException(
                    "Admin password reset failed: " + string.Join("; ", pw.Errors.Select(e => e.Description)));

            if (!await userManager.IsInRoleAsync(existing, "Admin"))
                await userManager.AddToRoleAsync(existing, "Admin");
            return;
        }
    }
}