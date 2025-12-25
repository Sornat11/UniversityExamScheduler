using FluentValidation;
using UniversityExamScheduler.Application.Dtos.Exam.Request;

namespace UniversityExamScheduler.Application.Validators.Exam;

public class UpdateExamDtoValidator : AbstractValidator<UpdateExamDto>
{
    public UpdateExamDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.LecturerId)
            .NotEmpty();

        RuleFor(x => x.GroupId)
            .NotEmpty();
    }
}
