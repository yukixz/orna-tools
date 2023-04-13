#!/bin/bash

echo "# Publish Check" >>$GITHUB_STEP_SUMMARY
echo '```' >>$GITHUB_STEP_SUMMARY

LAST_HASH="$([[ -f ${LAST_FILE} ]] && cat ${LAST_FILE})"
if [[ "${LAST_HASH}" = "${CURR_HASH}" ]]; then
    echo "changed=0" >>$GITHUB_OUTPUT
    echo "= ${LAST_HASH}" >>$GITHUB_STEP_SUMMARY
else
    echo "changed=1" >>$GITHUB_OUTPUT
    echo "${CURR_HASH}" >"${LAST_FILE}"
    echo "BUILD HASH" >>$GITHUB_STEP_SUMMARY
    echo "< ${LAST_HASH}" >>$GITHUB_STEP_SUMMARY
    echo "> ${CURR_HASH}" >>$GITHUB_STEP_SUMMARY
    echo "" >>$GITHUB_STEP_SUMMARY
fi

find build/ -type f -exec sha256sum {} \; >>$GITHUB_STEP_SUMMARY
echo '```' >>$GITHUB_STEP_SUMMARY
