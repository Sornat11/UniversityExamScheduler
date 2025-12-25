using FluentValidation;
using UniversityExamScheduler.Application.Dtos.Room.Request;

namespace UniversityExamScheduler.Application.Validators.Room;

public class CreateRoomDtoValidator : AbstractValidator<CreateRoomDto>
{
    public CreateRoomDtoValidator()
    {
        RuleFor(x => x.RoomNumber)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Capacity)
            .GreaterThan(0);

        RuleFor(x => x.Type)
            .IsInEnum();
    }
}
