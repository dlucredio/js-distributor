function validateEmail(email) {
  const emailRegex = /^[^\s@]+@(estudante\.ufscar\.br|gmail\.com)$/;

  if (!email) {
    return { isValid: false, errorMessage: 'Por favor, insira um email.' };
  } else if (email.length > 100) {
    return { isValid: false, errorMessage: 'O email inserido é muito longo. Por favor, insira um email mais curto.' };
  } else if (!emailRegex.test(email)) {
    return { isValid: false, errorMessage: 'Email inválido! Por favor, insira um email válido @estudante.ufscar.br ou @gmail.com.' };
  }

  return { isValid: true };
};
  
const handleValidation = () => {
    const validation = validateEmail(email);
  
    if (validation.isValid) {
      Alert.alert('Email válido!');
    } else {
      Alert.alert(validation.errorMessage);
    }
  };