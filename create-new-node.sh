#!/usr/bin/env bash

MULTICHIAN_DIR=${HOME}/.multichain
RED='\033[1;31m'
NC='\033[0m'
GREEN='\033[1;32m'

function ps(){
    printf "${GREEN}${1}${NC}\n"
}

function pe(){
    printf "${RED}${1}${NC}\n"
}

function get_chain_info(){
    read -p "Enter chain name : " CHAIN_NAME
    if [ "${CHAIN_NAME}" == "" ]
    then
	    pe "You did not enter any chain name. Exiting ..."
	    exit 1
	fi

	if [ ! -e "${MULTICHIAN_DIR}/${CHAIN_NAME}" ]
	then
		read -p "Chain doesn't exist. Do you want to create new (y/n) : " CREATE_NEW
		if [ "${CREATE_NEW}" == "y" ]
        then
            multichain-util create ${CHAIN_NAME}
            if [ "$?" != "0" ]; then
                pe "Unable to create chain"
                exit 1
            else
                ps "Chain created"
            fi
            read -p "Enter max block size (default - 4194304 bytes, max - 100000000 bytes) : " MAX_BLOCK_SIZE
            if [ "${MAX_BLOCK_SIZE}" != "" ]
            then
                MAX_BLOCK_SIZE=4194304
            fi
            sed -i -E "s/(max-std-tx-size = )[0-9]+(.*)/\1${MAX_BLOCK_SIZE}\2/" ${MULTICHIAN_DIR}/${CHAIN_NAME}/params.dat

        else
            pe "Exiting ..."
            exit 1
        fi
    else
        ps "Chain exists"
	fi
}

function get_app_ports(){
    read -p "Enter port for node app (Default - 3000) : " NODE_APP_PORT
    if [ "${NODE_APP_PORT}" == "" ]
    then
	    NODE_APP_PORT=3000
	fi

    read -p "Enter port for wallet app (Default - 4200) : " WALLET_APP_PORT
    if [ "${WALLET_APP_PORT}" == "" ]
    then
	    WALLET_APP_PORT=4200
	fi

    read -p "Is the ports are open in firewall (Y/N) : " IS_PORTS_OPEN
    if [ "${IS_PORTS_OPEN}" != "Y" ]
    then
	    pe "Exiting ..."
        exit 1
	fi

}

function start_multichain(){
    multichaind ${CHAIN_NAME} -daemon > /dev/null
    if [ "$?" != "0" ]; then
        pe "Unable to start chain in daemon : ${CHAIN_NAME}"
        exit 1
    else
        ps "Chain started : ${CHAIN_NAME}"
    fi
}

function configure_node_app(){
    #update port
    sed -i -E "s/(.*PORT.*)'[0-9]+'(.*)/\1'${NODE_APP_PORT}'\2/" ./bitcoin-node-test-v2/bin/www

    NETWORK_PORT=`cat ${MULTICHIAN_DIR}/${CHAIN_NAME}/params.dat | grep default-network-port | cut -d " " -f3`

    #update bc rpc port
    RPC_PORT=`cat ${MULTICHIAN_DIR}/${CHAIN_NAME}/params.dat | grep default-rpc-port | cut -d " " -f3`
    sed -i -E "s/(.*port: )'[0-9]+'(,.*)/\1'${RPC_PORT}'\2/" ./bitcoin-node-test-v2/routes/multichain.js

    #update bc password
    RPC_PASSWORD=`cat ${MULTICHIAN_DIR}/${CHAIN_NAME}/multichain.conf | grep rpcpassword | cut -d "=" -f2`
    sed -i -E "s/(.*pass: )'.+'(,.*)/\1'${RPC_PASSWORD}'\2/" ./bitcoin-node-test-v2/routes/multichain.js
}

function start_node_app(){
    pushd ./bitcoin-node-test-v2 > /dev/null
    npm install > /dev/null
    nohup npm start &
    popd > /dev/null
    ps "Admin app started"
}

function start_client_app(){
    sed -i -E "s/(.*PORT.*)'[0-9]+'(.*)/\1'${WALLET_APP_PORT}'\2/" ./wallet/bin/www
    pushd ./wallet > /dev/null
    npm install
    nohup npm start &
    popd > /dev/null
    ps "Wallet app started"
}

function print_result(){
    IP_ADDRESS=`ip route get 1 | awk '{print $NF;exit}'`
    output="\nIp Address : ${IP_ADDRESS}\nChain Name : ${CHAIN_NAME}\nNetwork Port : ${NETWORK_PORT}\nRpc Port : ${RPC_PORT}\nMax chain size : ${MAX_BLOCK_SIZE}\n"
    output="${output}\nAdmin URL : http://${IP_ADDRESS}:${NODE_APP_PORT}\nWallet URL :  http://${IP_ADDRESS}:${WALLET_APP_PORT}\n"
    ps "${output}"
    printf "${output}" > result.txt
}

function main(){

    get_chain_info

    get_app_ports

    start_multichain

    configure_node_app

    start_node_app

    start_client_app

    print_result

}

main