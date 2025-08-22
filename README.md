

# Self Signed Certificates

### Komunas App 
#### Generate Keystore
```bash
$ keytool -genkeypair -alias komunas-app-container -keyalg RSA -keysize 2048 \
-keystore komunas-app-keystore-container.jks -validity 3650 -storetype PKCS12 \
-dname "CN=komunas-app, OU=Software, O=Dipme, L=Richmond, ST=TX, C=US" \
-storepass 123456 -keypass 123456

$ keytool -exportcert -alias komunas-app-container \
-file komunas-app-cert-container.pem \
-keystore komunas-app-keystore-container.jks -storepass 123456 
```

#### Import to Gateway Truststore
Import the komunas certificate into the gateway truststore:
```bash
$ keytool -importcert -file komunas-app-cert-container.pem -alias komunas-app-container \
-keystore gateway-truststore.jks -storepass 123456
```

#### Import to Client Truststore
Import the komunas certificate into the client truststore:
```bash
$ keytool -importcert -file komunas-app-cert-container.pem -alias komunas-app-container \
-keystore client-truststore.jks -storepass 123456
```

#### Import to Eureka Truststore
Import the komunas certificate into the eureka truststore:
```bash
$ keytool -importcert -file komunas-app-cert-container.pem -alias komunas-app-container \
-keystore eureka-truststore.jks -storepass 123456
```

---

## Certificate Generation Process (Using Linqra Gateway Scripts)

### Step 1: Navigate to Linqra Gateway Scripts Folder
```bash
$ pwd
/Users/mehmetsen/IdeaProjects/Linqra/scripts
```

### Step 2: Generate Service Certificates
```bash
$ sudo ./generate-service-certs.sh komunas-app
```

### Step 3: Generated Files

#### Updated JKS Files (in Linqra Gateway)
The following truststore files will be updated:
- `eureka-truststore.jks`
- `client-truststore.jks` 
- `gateway-truststore.jks`

#### New Certificate Files (belonging to komunas-app)
- `komunas-app-cert-container.pem`
- `komunas-app-keystore-container.jks`

### Step 4: Copy Required Files to Komunas App
We copied the following files to `KOMUNASAPP/keys/` folder:
- `client-truststore.jks`
- `komunas-app-keystore-container.jks`





