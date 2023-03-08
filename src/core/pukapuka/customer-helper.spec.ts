import { convertPhoneNumber } from './customer.helper';

describe('Customer CRM Service ', () => {
  it('should convert 62 to 62', async () => {
    const result = convertPhoneNumber('6281350001696');
    expect(result).toEqual('6281350001696');
  });

  it('should convert 0 to 62', async () => {
    const result = convertPhoneNumber('081350001696');
    expect(result).toEqual('6281350001696');
  });
});
