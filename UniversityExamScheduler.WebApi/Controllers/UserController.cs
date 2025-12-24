using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.User.Request;
using UniversityExamScheduler.Application.Dtos.User.Respone;
using UniversityExamScheduler.Application.Services;

namespace UniversityExamScheduler.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IMapper _mapper;   
        public UserController(IUserService userService, IMapper mapper)
        {
            _userService = userService;     
            _mapper = mapper;
        }

       [HttpPost]
        public async Task<IActionResult> AddUser(CreateUserDto userDto, CancellationToken cancellationToken)
        {
            var createdUser = await _userService.AddAsync(userDto, cancellationToken);
            var createdDto = _mapper.Map<GetUserDto>(createdUser);
            return CreatedAtAction(nameof(GetById), new { id = createdUser.Id }, createdDto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken)
        {
            await _userService.RemoveAsync(id, cancellationToken);
            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
        {
            var user = await _userService.GetByIdAsync(id, cancellationToken);
            if (user is null) return NotFound();
            var userDto = _mapper.Map<GetUserDto>(user);
            return Ok(userDto);
        }

        [HttpGet]
        public async Task<IActionResult> GetByEmail([FromQuery] string email, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(email)) return BadRequest("email query parameter is required");
            var user = await _userService.GetByEmailAsync(email, cancellationToken);
            if (user is null) return NotFound();
            var userDto = _mapper.Map<GetUserDto>(user);
            return Ok(userDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, UpdateUserDto userDto, CancellationToken cancellationToken)
        {
            await _userService.UpdateAsync(id, userDto, cancellationToken);
            var updatedUser = await _userService.GetByIdAsync(id, cancellationToken);
            var updatedDto = _mapper.Map<GetUserDto>(updatedUser);
            return Ok(updatedDto);
        }
    }
}
