const { DataTypes } = require('sequelize');

module.exports = function(sequelize) {
    const User = sequelize.define('User', {
        email: {
          type: DataTypes.STRING,
        },
        name: {
            type: DataTypes.STRING,
        },
        phone: {
            type: DataTypes.STRING,
        },
        type: {
            type: DataTypes.INTEGER,
        },
        created_at: {
          type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    }, {
        tableName: "users",
        timestamps: false,
    });
    return User;     
}

