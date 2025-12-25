using FluentValidation;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Request;

namespace UniversityExamScheduler.Application.Validators.ExamTermHistory;

public class CreateExamTermHistoryDtoValidator : AbstractValidator<CreateExamTermHistoryDto>
{
    public CreateExamTermHistoryDtoValidator()
    {
        RuleFor(x => x.ExamTermId)
            .NotEmpty();

        RuleFor(x => x.ChangedBy)
            .NotEmpty();

        RuleFor(x => x.ChangedAt)
            .NotEmpty();

        RuleFor(x => x.PreviousStatus)
            .IsInEnum();

        RuleFor(x => x.NewStatus)
            .IsInEnum();
    }
}
