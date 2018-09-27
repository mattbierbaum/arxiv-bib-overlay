import os
import glob
import shutil

j = os.path.join

def find(path, st):
    paths = glob.glob(j(path, st))
    if paths:
        return paths[0]

p0 = os.path.abspath('./build/static')
p1 = os.path.abspath('./extension')

shutil.copyfile(find(p0, 'js/main.*.js'), j(p1, 'bibex.js'))
shutil.copyfile(find(p0, 'css/main.*.css'), j(p1, 'bibex.css'))
