export const registerUsersSchema = {
    email: {
        trim: true,
        escape: true,
        isEmail: {
            errorMessage: "Please enter a valid email."
        }
    },
    password: {
        isStrongPassword: {
            options: {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            },
            errorMessage: "The password must contain at least 8 characters, including one uppercase letter, one \
			lowercase letter, one number, and one symbol."
        }
    },
    username: {
        trim: true,
        escape: true,
        notEmpty: {
            errorMessage: "A username is required."
        },
        isLength: {
            option: {
                min: 3,
                max: 20,
            },
            errorMessage: "Between 3 and 20 characters"
        }
    }
};
export const loginSchema = {
    email: {
        trim: true,
        escape: true,
        isEmail: {
            errorMessage: "Please enter a valid email."
        }
    },
    password: {
        isStrongPassword: {
            options: {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            },
            errorMessage: "The password must contain at least 8 characters, including one uppercase letter, one \
			lowercase letter, one number, and one symbol."
        }
    },
};
//# sourceMappingURL=validationSchema.js.map