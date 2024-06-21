const generatedCodes = new Set<string>();

/**
 * 生成唯一的邮箱验证码
 * @param length 验证码长度
 * @returns 唯一的验证码
 */

export const generateRandomNumber = (length: number = 6): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomDigit = Math.floor(Math.random() * 10);
    result += randomDigit.toString();
  }
  return result;
};
