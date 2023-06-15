const { DataTypes } = require('sequelize');

module.exports = function(sequelize) {
    const FiatLog = sequelize.define('FiatLog', {
        user_id: {
            type: DataTypes.INTEGER,
        },
        amount: {
            type: DataTypes.INTEGER,
        },
        type: {
            type: DataTypes.INTEGER,
        },
        meta: {
            type: DataTypes.JSON,
        },
        order_no: {
            type: DataTypes.STRING,
        },
        balance: {
            type: DataTypes.INTEGER,  // will updated to decimal
        },
        deleted_at: {
          type: DataTypes.DATE
        },
        created_at: {
          type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    }, {
        tableName: "fiat_logs",
        timestamps: false,
    });
    return FiatLog;     
}

