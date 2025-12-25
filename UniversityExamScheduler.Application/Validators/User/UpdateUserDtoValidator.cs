using FluentValidation;
using UniversityExamScheduler.Application.Dtos.User.Request;

namespace UniversityExamScheduler.Application.Validators.User;

public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(320);

        RuleFor(x => x.FirstName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.ExternalId)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.ExternalId));

        RuleFor(x => x.Role)
            .IsInEnum();
    }
}
