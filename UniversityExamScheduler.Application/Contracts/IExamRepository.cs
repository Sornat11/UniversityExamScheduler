using System;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Contracts;

public interface IExamRepository  : IBaseRepository<Exam>
{
    // Define methods specific to Exam entity here
}
