import fs from 'fs/promises';
import validator from 'validator';

// Function to validate a person registration
function validatePerson(person) {
    const errors = [];

    // Name: must not be empty
    if (!person.name || validator.isEmpty(person.name.trim())) {
        errors.push('Name is required.');
    }

    // Email: must be valid
    if (!person.email || !validator.isEmail(person.email)) {
        errors.push('Invalid email.');
    }

    // Phone: only digits, Brazilian format
    if (!person.phone || !validator.isMobilePhone(person.phone, 'pt-BR')) {
        errors.push('Invalid phone number.');
    }

    // Birth date: must be a valid date in YYYY-MM-DD format
    if (!person.birthDate || !validator.isDate(person.birthDate)) {
        errors.push('Invalid birth date.');
    }

    // CPF: only digits, must be 11 characters (simple check)
    if (!person.cpf || !validator.isLength(person.cpf.replace(/\D/g, ''), { min: 11, max: 11 })) {
        errors.push('Invalid CPF.');
    }

    return errors;
}

// Function to register a person and check validation
async function registerPerson(person) {
    const validationErrors = validatePerson(person);

    if (validationErrors.length > 0) {
        return {
            success: false,
            message: 'Registration failed due to validation errors.',
            errors: validationErrors
        };
    } else {
        console.log('Registration is valid!');

        // Let's save to a file
        await fs.appendFile('database.json', JSON.stringify(person) + '\n', 'utf-8');
        console.log('Inserted into the database');

        return {
            success: true,
            message: 'Registration successful!'
        };
    }
}

async function main() {
    const registration = {
        name: 'Maria Silva',
        email: 'maria.silva@example.com',
        phone: '+5511999998888',
        birthDate: '1990-05-12',
        cpf: '123.456.789-09'
    };

    await registerPerson(registration);

}

export default main;