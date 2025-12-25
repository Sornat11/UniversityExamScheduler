using FluentValidation;
using UniversityExamScheduler.Application.Dtos.Room.Request;

namespace UniversityExamScheduler.Application.Validators.Room;

public class UpdateRoomDtoValidator : AbstractValidator<UpdateRoomDto>
{
    public UpdateRoomDtoValidator()
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
