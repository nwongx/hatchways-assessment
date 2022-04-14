import { average } from './arithmetic';

test('rounding average', () => {
  const mockGradesList = [
    ['78', '100', '92', '86', '89', '88', '91', '87'],
    ['75', '89', '95', '93', '99', '82', '89', '76'],
    ['88', '90', '79', '82', '81', '99', '94', '73'],
    [],
  ];
  const expectedGradesAvgList = [88.875, 87.25, 85.75, -1];
  mockGradesList.forEach((mockGrades, i) => {
    expect(average(mockGrades)).toBe(expectedGradesAvgList[i]);
  });
});
