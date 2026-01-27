using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.User.Request;
using UniversityExamScheduler.Application.Dtos.User.Respone;
using UniversityExamScheduler.Application.Services;
using Microsoft.AspNetCore.Authorization;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Application.Dtos;

namespace UniversityExamScheduler.WebApi.Controllers
{
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
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
        public async Task<IActionResult> GetByEmail(
            [FromQuery] string? email,
            [FromQuery] string? search,
            [FromQuery] Role? role,
            [FromQuery] bool? isActive,
            [FromQuery] bool? isStarosta,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            if (!string.IsNullOrWhiteSpace(email))
            {
                var user = await userService.GetByEmailAsync(email, cancellationToken);
                if (user is null) return NotFound();
                var userDto = mapper.Map<GetUserDto>(user);
                return Ok(userDto);
            }

            var normalizedPage = page < 1 ? 1 : page;
            var normalizedPageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 100);

            var (items, total) = await userService.SearchAsync(
                search,
                role,
                isActive,
                isStarosta,
                normalizedPage,
                normalizedPageSize,
                cancellationToken);
            var dtos = mapper.Map<IEnumerable<GetUserDto>>(items);
            var paged = new PagedResult<GetUserDto>
            {
                Items = dtos,
                TotalCount = total,
                Page = normalizedPage,
                PageSize = normalizedPageSize
            };
            return Ok(paged);
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
