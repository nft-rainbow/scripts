const { DataTypes } = require('sequelize');

module.exports = function(sequelize) {
    const MintTask = sequelize.define('MintTask', {
        app_id: {
            type: DataTypes.INTEGER,
        },
        chain_type: {
            type: DataTypes.INTEGER,
        },
        chain_id: {
            type: DataTypes.INTEGER,
        },
        contract: {
            type: DataTypes.STRING,
        },
        mint_to: {
            type: DataTypes.STRING,
        },
        token_uri: {
            type: DataTypes.STRING,
        },
        token_id: {
            type: DataTypes.INTEGER,
        },
        amount: {
            type: DataTypes.INTEGER,
        },
        status: {
            type: DataTypes.INTEGER,
        },
        tx_id: {
            type: DataTypes.INTEGER,
        },
        hash: {
            type: DataTypes.STRING,
        },
        error: {
            type: DataTypes.STRING,
        },
        contract_type: {
            type: DataTypes.INTEGER,
        },
        mint_type: {
            type: DataTypes.INTEGER,
        },
        created_at: {
          type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    }, {
        tableName: "mint_tasks",
        timestamps: false,
    });
    return MintTask;
}

