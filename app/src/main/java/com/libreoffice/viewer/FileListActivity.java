package com.libreoffice.viewer;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ListView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import org.libreoffice.androidlib.LOActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.nio.channels.Channels;
import java.nio.channels.FileChannel;
import java.nio.channels.ReadableByteChannel;
import java.util.ArrayList;
import java.util.List;

public class FileListActivity extends AppCompatActivity {

    private ListView mListView;
    private FileListAdapter mAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_file_list);
        initView();

        checkPermission();
    }

    private void initView() {

        mListView = findViewById(R.id.lv_file_list);
        mAdapter = new FileListAdapter(this);
        mListView.setAdapter(mAdapter);

        mListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {
                String filePath = mAdapter.getList().get(i).getAbsolutePath();
                showFileView(filePath);
            }
        });
    }

    private void showFileList() {
        String documentPath = Environment.getExternalStorageDirectory() + File.separator + Environment.DIRECTORY_DOCUMENTS;
        File dirFile = new File(documentPath);
        File[] files = dirFile.listFiles();
        List<File> fileList = new ArrayList<>();
        if (files != null && files.length > 0) {
            for (File file : files) {
                if (file.isFile()) {
                    fileList.add(file);
                }
            }
            mAdapter.setData(fileList);
        } else {
            mAdapter.setData(null);
        }
    }

    private void showFileView(String filePath) {
        Intent intent = new Intent();
        intent.putExtra("filePath", filePath);
        intent.setClass(FileListActivity.this, LOActivity.class);
        startActivity(intent);
    }

    private void startCopyTask() {
        new AsyncTask<Void, Void, Void>() {
            @Override
            protected Void doInBackground(Void... voids) {
                copyTestFile();
                return null;
            }

            @Override
            protected void onPostExecute(Void aVoid) {
                showFileList();
            }
        }.execute();
    }

    private void copyTestFile() {
        String targetDir = Environment.getExternalStorageDirectory() + File.separator + Environment.DIRECTORY_DOCUMENTS;
        File targetFile = new File(targetDir);
        if (!targetFile.exists()) {
            targetFile.mkdir();
        }
        try {
            AssetManager assetManager = this.getAssets();
            String[] files = assetManager.list("testFile");
            for (String file : files) {
                ReadableByteChannel source = Channels.newChannel(assetManager.open("testFile" + File.separator + file));
                FileChannel destFile = new FileOutputStream(targetDir + File.separator + file).getChannel();
                ByteBuffer buffer = ByteBuffer.allocate(4096);
                while (source.read(buffer) > 0) {
                    buffer.flip();
                    destFile.write(buffer);
                    buffer.clear();
                }
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }


    private void checkPermission() {
        String[] permissions = {Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE};
        requestPermissions(permissions, 101);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 101) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startCopyTask();
            } else {
                Toast.makeText(this, "存储权限拒绝", Toast.LENGTH_SHORT).show();
            }
        }
    }

}