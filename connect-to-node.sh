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

function get_node_info(){
    echo "Please input node information"

    read -p "Enter chain name : " CHAIN_NAME
    if [ "${CHAIN_NAME}" == "" ]
    then
	    pe "You did not enter any chain name. Exiting ..."
	    exit 1
	fi

	read -p "Enter IP address : " IP_ADDRESS
    if [ "${IP_ADDRESS}" == "" ]
    then
	    pe "You did not enter any ip address. Exiting ..."
	    exit 1
	fi

	read -p "Enter Port : " PORT
    if [ "${PORT}" == "" ]
    then
	    pe "You did not enter any port. Exiting ..."
	    exit 1
	fi

	if [ -e "${MULTICHIAN_DIR}/${CHAIN_NAME}" ]
	then
        pe "Chain already exists"
        exit 1
	fi
}

function connecting_to_node(){
    data=$(multichaind ${CHAIN_NAME}@${IP_ADDRESS}:${PORT} | grep "connect,send,receive")
    echo "Please grand the permission for this node. Copy the following command and run it in the first node"
    echo $data
}

function start_chain(){
    read -p "Do you grant permission (Y/N)? " IS_GRANT
    if [ "${IS_GRANT}" == "Y" ]
    then
	    multichaind ${CHAIN_NAME} -daemon
	    if [ "$?" != "0" ]; then
            pe "Unable to start chain in daemon : ${CHAIN_NAME}"
            exit 1
        else
            ps "Chain started : ${CHAIN_NAME}"
        fi
    else
         pe "Unable to start chain : ${CHAIN_NAME}"
         exit 1
	fi
}

function print_result(){
    IP_ADDRESS_LOCAL=`ip route get 1 | awk '{print $NF;exit}'`
    output="\nChain Name : ${CHAIN_NAME}\nRemote node's Ip Address : ${IP_ADDRESS}\nRemote node's port : ${PORT}\n"
    output="${output}\nLocal node's Ip Address : ${IP_ADDRESS_LOCAL}"
    ps "${output}"
    printf "${output}" > result.txt
}

function main(){

    get_node_info

    connecting_to_node

    start_chain

    print_result

}

main