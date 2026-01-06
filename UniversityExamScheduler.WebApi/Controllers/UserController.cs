using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.User.Request;
using UniversityExamScheduler.Application.Dtos.User.Respone;
using UniversityExamScheduler.Application.Services;
using Microsoft.AspNetCore.Authorization;

namespace UniversityExamScheduler.WebApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class UserController(IUserService userService, IMapper mapper) : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> AddUser(CreateUserDto userDto, CancellationToken cancellationToken)
        {
            var createdUser = await userService.AddAsync(userDto, cancellationToken);
            var createdDto = mapper.Map<GetUserDto>(createdUser);
            return CreatedAtAction(nameof(GetById), new { id = createdUser.Id }, createdDto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken)
        {
            await userService.RemoveAsync(id, cancellationToken);
            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
        {
            var user = await userService.GetByIdAsync(id, cancellationToken);
            if (user is null) return NotFound();
            var userDto = mapper.Map<GetUserDto>(user);
            return Ok(userDto);
        }

        [HttpGet]
        public async Task<IActionResult> GetByEmail([FromQuery] string email, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(email)) return BadRequest("email query parameter is required");
            var user = await userService.GetByEmailAsync(email, cancellationToken);
            if (user is null) return NotFound();
            var userDto = mapper.Map<GetUserDto>(user);
            return Ok(userDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, UpdateUserDto userDto, CancellationToken cancellationToken)
        {
            await userService.UpdateAsync(id, userDto, cancellationToken);
            var updatedUser = await userService.GetByIdAsync(id, cancellationToken);
            var updatedDto = mapper.Map<GetUserDto>(updatedUser);
            return Ok(updatedDto);
        }
    }
}
