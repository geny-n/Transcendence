export declare const registerUsersSchema: {
    email: {
        trim: boolean;
        escape: boolean;
        isEmail: {
            errorMessage: string;
        };
    };
    password: {
        isStrongPassword: {
            options: {
                minLength: number;
                minLowercase: number;
                minUppercase: number;
                minNumbers: number;
                minSymbols: number;
            };
            errorMessage: string;
        };
    };
    username: {
        trim: boolean;
        escape: boolean;
        notEmpty: {
            errorMessage: string;
        };
        isLength: {
            option: {
                min: number;
                max: number;
            };
            errorMessage: string;
        };
    };
};
export declare const loginSchema: {
    email: {
        trim: boolean;
        escape: boolean;
        isEmail: {
            errorMessage: string;
        };
    };
    password: {
        isStrongPassword: {
            options: {
                minLength: number;
                minLowercase: number;
                minUppercase: number;
                minNumbers: number;
                minSymbols: number;
            };
            errorMessage: string;
        };
    };
};
//# sourceMappingURL=validationSchema.d.ts.map