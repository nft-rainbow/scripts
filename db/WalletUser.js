const { DataTypes } = require('sequelize');

module.exports = function(sequelize) {
    const WalletUser = sequelize.define('WalletUser', {
        wallet: {
            type: DataTypes.INTEGER,
        },
        phone: {
            type: DataTypes.INTEGER,
        },
        address: {
            type: DataTypes.INTEGER,
        },
        created_at: {
          type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    }, {
        tableName: "wallet_users",
        timestamps: false,
    });
    return WalletUser;     
}

