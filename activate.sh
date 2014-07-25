#!/bin/bash

DEST="~/.ipython/profile_default/static/custom"
eval DEST=$DEST # expand '~' , see http://stackoverflow.com/a/3963747

# make backup if destination dir already exists
# http://stackoverflow.com/a/59839
if [ -d "${DEST}" ]; then
    # echo "hallo"
    echo "creating backup '${DEST}_backup' from '$DEST'"
    cp -r "$DEST" "${DEST}_backup"

    if [ -L "${DEST}" ]; then
        # It is a symlink, remove it
        echo "remove old '$DEST'"
        rm "${DEST}"
    fi
fi

BASEDIR=$(pwd)/$(dirname $0) # http://stackoverflow.com/a/4175309, http://stackoverflow.com/a/242550
eval BASEDIR=$BASEDIR
# make symbolic link
ln -s "${BASEDIR}" $DEST
echo ln -s "${BASEDIR}" $DEST