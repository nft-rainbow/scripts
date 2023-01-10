const { DataTypes } = require('sequelize');

module.exports = function(sequelize) {
    const UserBalance = sequelize.define('UserBalance', {
        user_id: {
            type: DataTypes.INTEGER,
        },
        balance: {
            type: DataTypes.INTEGER,
        },
        created_at: {
          type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    }, {
        tableName: "user_balances",
        timestamps: false,
    });
    return UserBalance;     
}

