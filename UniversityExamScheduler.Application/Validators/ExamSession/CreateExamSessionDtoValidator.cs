using FluentValidation;
using UniversityExamScheduler.Application.Dtos.ExamSession.Request;

namespace UniversityExamScheduler.Application.Validators.ExamSession;

public class CreateExamSessionDtoValidator : AbstractValidator<CreateExamSessionDto>
{
    public CreateExamSessionDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.StartDate)
            .NotEmpty();

        RuleFor(x => x.EndDate)
            .NotEmpty();

        RuleFor(x => x)
            .Must(x => x.StartDate <= x.EndDate)
            .WithMessage("Session start date must be on or before end date.");
    }
}
