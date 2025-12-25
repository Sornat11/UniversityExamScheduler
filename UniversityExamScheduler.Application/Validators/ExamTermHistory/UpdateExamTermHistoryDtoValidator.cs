using FluentValidation;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Request;

namespace UniversityExamScheduler.Application.Validators.ExamTermHistory;

public class UpdateExamTermHistoryDtoValidator : AbstractValidator<UpdateExamTermHistoryDto>
{
    public UpdateExamTermHistoryDtoValidator()
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
