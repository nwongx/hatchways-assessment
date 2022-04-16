import { validateTag, validateName } from './string';

describe('validate tag', () => {
  test('invalid tag', () => {

    expect(validateTag('tag with space')).toEqual(false);
    expect(validateTag('TagWithNonLetterAndNumber&')).toEqual(false);
    expect(validateTag(' ')).toEqual(false);

  })

  test('valid tag', () => {
    expect(validateTag('')).toEqual(true);
    expect(validateTag('Tag20')).toEqual(true);
    expect(validateTag('123')).toEqual(true);
    expect(validateTag('tag')).toEqual(true);
  })
})

describe('validate name', () => {
  test('invalid name', () => {

    expect(validateName('name with spaces')).toEqual(false);
    expect(validateName('nameWithNonLetter&')).toEqual(false);
    expect(validateName('NameWithNumber10')).toEqual(false);
    expect(validateName(' ')).toEqual(false);

  })

  test('valid tag', () => {
    expect(validateName('')).toEqual(true);
    expect(validateName('Ben')).toEqual(true);
    expect(validateName('Ben Ben')).toEqual(true);
  })
})