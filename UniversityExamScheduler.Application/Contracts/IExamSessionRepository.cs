using System;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Contracts;

public interface IExamSessionRepository : IBaseRepository<ExamSession>
{
    // Define methods specific to ExamSession entity here
}
