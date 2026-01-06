using System;
using FluentValidation;
using UniversityExamScheduler.Application.Dtos.User.Request;

namespace UniversityExamScheduler.Application.Validators.User;

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(320);

        RuleFor(x => x.Role)
            .IsInEnum();

        RuleFor(x => x.FirstName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.IsStarosta)
            .Equal(false)
            .When(x => x.Role != Domain.Enums.Role.Student)
            .WithMessage("Only students can be marked as starosta.");
    }
}
