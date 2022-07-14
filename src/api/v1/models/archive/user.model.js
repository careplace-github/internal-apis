userSchema.methods.generateJWT = async function () {
    let payload = {
        username: this.username,
        email: this.email,
        name: this.name,
        id: this._id
    };
    // @todo
    return await sign(payload, JWT_secret, {expiresIn: "1 day" })
}

userSchema.methods.generatePasswordResetToken = function () {
    //@todo confirm expiration date and token size
    this.resetPasswordToken.token.expirationDate = Date.now() + 36000000
    this.resetPasswordToken.token.tokenString = randomBytes(20).toString("hex")
}

userSchema.methods.getUserInfo = function () {
    return pick(this, ["_id", "username", "email", "name" ])
}

userSchema.pre('save', async function (next) {
    let user = this
    if(!user.isModified("password")) return next()
    // @todo confirm round of source
    user.password = await hash(user.password, 14)
    next()
})

userSchema.methods.comparePassword = async function (password) {
    return await compare(password, this.password)
}