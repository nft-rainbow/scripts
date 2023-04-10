const { DataTypes } = require('sequelize');

module.exports = function(sequelize) {
    const DepositOrder = sequelize.define('DepositOrder', {
        user_id: {
            type: DataTypes.INTEGER,
        },
        amount: {
            type: DataTypes.INTEGER,
        },
        type: {
            type: DataTypes.INTEGER,
        },
        status: {
            type: DataTypes.INTEGER,
        },
        description: {
            type: DataTypes.STRING,
        },
        trade_no: {
            type: DataTypes.STRING,
        },
        meta: {
            type: DataTypes.JSON,
        },
        created_at: {
          type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    }, {
        tableName: "deposit_orders",
        timestamps: false,
    });
    return DepositOrder;     
}

