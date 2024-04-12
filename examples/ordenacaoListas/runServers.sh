# npm run generate-single

cd src-gen

arquivos=$(ls -1)
for arquivo in $arquivos
do
    if [[ "$arquivo" == start* ]]; then
        gnome-terminal -- bash -c "node $arquivo"
    fi
done