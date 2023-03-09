import { convertPhoneNumber } from './customer.helper';

describe('Customer Helper', () => {
  it('should convert 62 to 62', async () => {
    const result = convertPhoneNumber('6281350001696');
    expect(result).toEqual('6281350001696');
  });

  it('should convert 0 to 62', async () => {
    const result = convertPhoneNumber('081350001696');
    expect(result).toEqual('6281350001696');
  });

  it('should remove stripes', async () => {
    const result = convertPhoneNumber('0813-5000-1696');
    expect(result).toEqual('6281350001696');
  });

  it('should remove spaces', async () => {
    const result = convertPhoneNumber('0813 5000 1696');
    expect(result).toEqual('6281350001696');
  });
});
