using FluentValidation;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Request;

namespace UniversityExamScheduler.Application.Validators.StudentGroup;

public class UpdateStudentGroupDtoValidator : AbstractValidator<UpdateStudentGroupDto>
{
    public UpdateStudentGroupDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(150);

        RuleFor(x => x.FieldOfStudy)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.StudyType)
            .IsInEnum();

        RuleFor(x => x.Semester)
            .GreaterThanOrEqualTo(1);

        RuleFor(x => x.StarostaId)
            .NotEmpty();
    }
}
