import type { Location } from "express-validator";

export const registerUsersSchema = {
	email: {
		trim: true,
		escape: true,
		notEmpty: {
			errorMessage: "A email is required."
		},
		isEmail: {
			errorMessage : "Please enter a valid email."
		}
	},
	password : {
		notEmpty: {
			errorMessage: "A password is required."
		},
		isStrongPassword: {
			options : {
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
			options: {
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
		notEmpty: {
			errorMessage: "A email is required."
		},
		isEmail: {
			errorMessage : "Please enter a valid email."
		}
	},
	password : {
		notEmpty: {
			errorMessage: "A password is required."
		},
		isStrongPassword: {
			options : {
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

export const updateProfileSchema = {
	email: {
		optional: true,
		trim: true,
		escape: true,
		isEmail: {
			errorMessage : "Please enter a valid email."
		}
	},
	username : {
		optional: true,	
		trim: true,
		escape: true,
		isLength: {
			options: {
				min: 3,
				max: 20,
			},
			errorMessage: "Between 3 and 20 characters"
		}
	},
};

export const changePasswordSchema = {
	currentPassword: {
		notEmpty: {
			errorMessage: "A password is required."
		}
	},
	newPassword : {
		notEmpty: {
			errorMessage: "A password is required."
		},
		isStrongPassword: {
			options : {
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

export const friendRequestSchema = {
	receiverId: {
		notEmpty: {
			errorMessage : "The ID of the user who will receive the friend request is required."
		},
		isUUID: {
			version: 4,
			errorMessage: "The ID provided is not a valid UUID."
		}
	}
}

export const friendActionSchema = {
	action: {
		in: ['body'] as Location[],
		isIn: {
			options: [['accept', 'reject', 'block','cancel']],
			errorMessage: 'Action must be accept, reject, block or cancel',
		},
	},
};