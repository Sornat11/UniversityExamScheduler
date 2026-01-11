using FluentValidation;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Request;

namespace UniversityExamScheduler.Application.Validators.ExamTerm;

public class CreateExamTermDtoValidator : AbstractValidator<CreateExamTermDto>
{
    public CreateExamTermDtoValidator()
    {
        RuleFor(x => x.CourseId)
            .NotEmpty();

        RuleFor(x => x.SessionId)
            .NotEmpty();

        RuleFor(x => x.Date)
            .NotEmpty();

        RuleFor(x => x.StartTime)
            .NotEmpty();

        RuleFor(x => x.EndTime)
            .NotEmpty()
            .GreaterThan(x => x.StartTime)
            .WithMessage("End time must be after start time.");

        RuleFor(x => x.Type)
            .IsInEnum();

        RuleFor(x => x.Status)
            .IsInEnum();

    }
}
